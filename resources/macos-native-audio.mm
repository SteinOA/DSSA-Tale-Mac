// MIT. App-local CoreAudio playback; never modifies default device properties.
#define NAPI_VERSION 8
#include "node_api.h"
#import <Foundation/Foundation.h>
#include <AudioToolbox/AudioToolbox.h>
#include <CoreAudio/CoreAudio.h>
#include <atomic>
#include <chrono>
#include <thread>
#include <vector>
#include <string>
#include <cmath>
static napi_value Str(napi_env e,const std::string &s){napi_value v;napi_create_string_utf8(e,s.c_str(),s.size(),&v);return v;}
static void Set(napi_env e,napi_value o,const char*k,napi_value v){napi_set_named_property(e,o,k,v);}
static std::string ReadCF(AudioDeviceID id,AudioObjectPropertySelector sel){AudioObjectPropertyAddress a={sel,kAudioObjectPropertyScopeGlobal,kAudioObjectPropertyElementMain};CFStringRef s=nullptr;UInt32 n=sizeof(s);if(AudioObjectGetPropertyData(id,&a,0,nullptr,&n,&s)!=noErr||!s)return "";char b[4096]={};CFStringGetCString(s,b,sizeof(b),kCFStringEncodingUTF8);CFRelease(s);return b;}
static napi_value List(napi_env e,napi_callback_info){
 AudioObjectPropertyAddress a={kAudioHardwarePropertyDevices,kAudioObjectPropertyScopeGlobal,kAudioObjectPropertyElementMain};UInt32 size=0;OSStatus st=AudioObjectGetPropertyDataSize(kAudioObjectSystemObject,&a,0,nullptr,&size);if(st){napi_throw_error(e,nullptr,"CoreAudio device enumeration failed");return nullptr;}
 std::vector<AudioDeviceID> ids(size/sizeof(AudioDeviceID));st=AudioObjectGetPropertyData(kAudioObjectSystemObject,&a,0,nullptr,&size,ids.data());if(st){napi_throw_error(e,nullptr,"CoreAudio device read failed");return nullptr;}
 napi_value result;napi_create_array(e,&result);uint32_t index=0;
 for(auto id:ids){AudioObjectPropertyAddress p={kAudioDevicePropertyStreamConfiguration,kAudioDevicePropertyScopeOutput,kAudioObjectPropertyElementMain};UInt32 bytes=0;if(AudioObjectGetPropertyDataSize(id,&p,0,nullptr,&bytes)||!bytes)continue;std::vector<unsigned char> data(bytes);if(AudioObjectGetPropertyData(id,&p,0,nullptr,&bytes,data.data()))continue;auto *list=(AudioBufferList*)data.data();UInt32 channels=0;for(UInt32 i=0;i<list->mNumberBuffers;i++)channels+=list->mBuffers[i].mNumberChannels;if(!channels)continue;auto uid=ReadCF(id,kAudioDevicePropertyDeviceUID);if(uid.empty())continue;napi_value item;napi_create_object(e,&item);Set(e,item,"uid",Str(e,uid));Set(e,item,"label",Str(e,ReadCF(id,kAudioObjectPropertyName)));napi_set_element(e,result,index++,item);}
 return result;
}
struct Job{napi_async_work work;napi_deferred deferred;std::string uid,kind,stage;OSStatus status=0;std::atomic<bool> consumed{false};bool timeout=false;};
static void Callback(void*ctx,AudioQueueRef,AudioQueueBufferRef){((Job*)ctx)->consumed.store(true);}
static void Execute(napi_env,void*ptr){@autoreleasepool{
 auto*j=(Job*)ptr;AudioQueueRef queue=nullptr;AudioStreamBasicDescription format={};format.mSampleRate=48000;format.mFormatID=kAudioFormatLinearPCM;format.mFormatFlags=kAudioFormatFlagIsFloat|kAudioFormatFlagIsPacked;format.mBytesPerPacket=8;format.mFramesPerPacket=1;format.mBytesPerFrame=8;format.mChannelsPerFrame=2;format.mBitsPerChannel=32;
 j->stage="AudioQueueNewOutput";j->status=AudioQueueNewOutput(&format,Callback,j,nullptr,nullptr,0,&queue);if(j->status)return;
 if(!j->uid.empty()){CFStringRef uid=CFStringCreateWithCString(nullptr,j->uid.c_str(),kCFStringEncodingUTF8);j->stage="Select device";j->status=AudioQueueSetProperty(queue,kAudioQueueProperty_CurrentDevice,&uid,sizeof(uid));CFRelease(uid);}
 AudioQueueBufferRef buffer=nullptr;const UInt32 frames=21600;
 if(!j->status){j->stage="Allocate buffer";j->status=AudioQueueAllocateBuffer(queue,frames*8,&buffer);}
 if(!j->status){float*out=(float*)buffer->mAudioData;for(UInt32 i=0;i<frames;i++){double t=(double)i/48000;double frequency=j->kind=="stop"?440:(j->kind=="start"?659.25:523.25);double gain=0.12*std::min(1.0,t/0.02)*std::min(1.0,(0.45-t)/0.04);float sample=sin(t*frequency*6.28318530718)*gain;out[i*2]=out[i*2+1]=sample;}buffer->mAudioDataByteSize=frames*8;j->stage="Enqueue buffer";j->status=AudioQueueEnqueueBuffer(queue,buffer,0,nullptr);}
 if(!j->status){j->stage="Start playback";j->status=AudioQueueStart(queue,nullptr);}
 if(!j->status){j->stage="Wait for playback";auto until=std::chrono::steady_clock::now()+std::chrono::seconds(3);while(!j->consumed.load()&&std::chrono::steady_clock::now()<until)std::this_thread::sleep_for(std::chrono::milliseconds(10));j->timeout=!j->consumed.load();}
 AudioQueueStop(queue,true);AudioQueueDispose(queue,true);
}}
static void Complete(napi_env e,napi_status asyncStatus,void*ptr){auto*j=(Job*)ptr;napi_value result;napi_create_object(e,&result);napi_value ok;napi_get_boolean(e,asyncStatus==napi_ok&&!j->status&&!j->timeout,&ok);Set(e,result,"success",ok);napi_value code;napi_create_int32(e,j->status,&code);Set(e,result,"osStatus",code);Set(e,result,"stage",Str(e,j->stage));Set(e,result,"error",Str(e,j->timeout?"CoreAudio playback timed out":j->status?j->stage+": OSStatus "+std::to_string(j->status):asyncStatus!=napi_ok?"Audio worker failed":""));napi_resolve_deferred(e,j->deferred,result);napi_delete_async_work(e,j->work);delete j;}
static napi_value Play(napi_env e,napi_callback_info info){size_t count=2;napi_value args[2];napi_get_cb_info(e,info,&count,args,nullptr,nullptr);auto*j=new Job();for(size_t i=0;i<count;i++){size_t n=0;if(napi_get_value_string_utf8(e,args[i],nullptr,0,&n)!=napi_ok||n>4096){delete j;napi_throw_type_error(e,nullptr,"Expected device UID and optional cue kind strings");return nullptr;}std::vector<char>b(n+1);napi_get_value_string_utf8(e,args[i],b.data(),b.size(),&n);(i?j->kind:j->uid)=std::string(b.data(),n);}napi_value promise,name;napi_create_promise(e,&j->deferred,&promise);name=Str(e,"CoreAudio tone");napi_create_async_work(e,nullptr,name,Execute,Complete,j,&j->work);napi_queue_async_work(e,j->work);return promise;}
static napi_value Init(napi_env e,napi_value exports){napi_property_descriptor p[]={{"listOutputs",nullptr,List,nullptr,nullptr,nullptr,napi_default,nullptr},{"playTone",nullptr,Play,nullptr,nullptr,nullptr,napi_default,nullptr}};napi_define_properties(e,exports,sizeof(p)/sizeof(p[0]),p);return exports;}
NAPI_MODULE(NODE_GYP_MODULE_NAME,Init)
