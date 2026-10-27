// MIT. Send the paste shortcut from the app process that the user authorized.
// No helper process, Apple Events permission or keyboard monitoring is needed.
#define NAPI_VERSION 8
#include "node_api.h"
#import <AppKit/AppKit.h>
#import <ApplicationServices/ApplicationServices.h>
#include <unistd.h>

static napi_value Bool(napi_env env, bool value) {
  napi_value result; napi_get_boolean(env, value, &result); return result;
}
static napi_value Fail(napi_env env, const char *code, const char *message) {
  napi_throw_error(env, code, message); return nullptr;
}
static napi_value Status(napi_env env, napi_callback_info info) {
  napi_value result; napi_create_object(env, &result);
  napi_set_named_property(env, result, "trusted", Bool(env, AXIsProcessTrusted()));
  napi_set_named_property(env, result, "canPost", Bool(env, CGPreflightPostEventAccess()));
  return result;
}
static napi_value Paste(napi_env env, napi_callback_info info) {
  if (!AXIsProcessTrusted() || !CGPreflightPostEventAccess())
    return Fail(env, "ACCESSIBILITY_REQUIRED", "Mac-tillatelse til automatisk innliming mangler.");
  size_t argc = 1; napi_value argv[1]; napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  int32_t expectedPid = 0;
  if (argc && napi_get_value_int32(env, argv[0], &expectedPid) != napi_ok)
    return Fail(env, "INVALID_TARGET", "Ugyldig målprogram.");
  @autoreleasepool {
    NSRunningApplication *target = [[NSWorkspace sharedWorkspace] frontmostApplication];
    pid_t pid = target ? [target processIdentifier] : 0;
    if (pid <= 0 || pid == getpid())
      return Fail(env, "NO_EXTERNAL_TARGET", "Klikk i tekstfeltet i en annen app før du dikterer.");
    if (expectedPid > 0 && pid != expectedPid)
      return Fail(env, "TARGET_CHANGED", "Målprogrammet ble endret. Teksten er beholdt i utklippstavlen.");
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStatePrivate);
    CGEventRef down = CGEventCreateKeyboardEvent(source, 0x09, true);
    CGEventRef up = CGEventCreateKeyboardEvent(source, 0x09, false);
    if (!down || !up) {
      if (down) CFRelease(down); if (up) CFRelease(up); if (source) CFRelease(source);
      return Fail(env, "EVENT_FAILED", "Mac-en kunne ikke opprette innlimingstasten.");
    }
    CGEventSetFlags(down, kCGEventFlagMaskCommand);
    CGEventSetFlags(up, kCGEventFlagMaskCommand);
    CGEventPost(kCGSessionEventTap, down);
    usleep(8000);
    CGEventPost(kCGSessionEventTap, up);
    CFRelease(down); CFRelease(up); if (source) CFRelease(source);
    return Bool(env, true);
  }
}
static napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
    {"status", nullptr, Status, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"paste", nullptr, Paste, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 2, properties); return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
