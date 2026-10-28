// MIT. Send the paste shortcut from the app process that the user authorized.
// No helper process, Apple Events permission or keyboard monitoring is needed.
#define NAPI_VERSION 8
#include "node_api.h"
#import <AppKit/AppKit.h>
#import <ApplicationServices/ApplicationServices.h>
#include <unistd.h>

static AXUIElementRef pasteField = nullptr;
static NSString *beforeText = nil;
static NSString *expectedText = nil;
static NSString *ReadText(AXUIElementRef field) {
  CFTypeRef value = nullptr;
  if (!field || AXUIElementCopyAttributeValue(field, kAXValueAttribute, &value) != kAXErrorSuccess) return nil;
  NSString *text = CFGetTypeID(value) == CFStringGetTypeID() ? [(NSString *)value copy] : nil;
  CFRelease(value); return [text autorelease];
}
static void ClearCheck() {
  if (pasteField) CFRelease(pasteField);
  pasteField = nullptr;
  [beforeText release]; beforeText = nil;
  [expectedText release]; expectedText = nil;
}

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
    ClearCheck();
    AXUIElementRef application = AXUIElementCreateApplication(pid);
    CFTypeRef focused = nullptr;
    if (AXUIElementCopyAttributeValue(application, kAXFocusedUIElementAttribute, &focused) == kAXErrorSuccess) {
      pasteField = (AXUIElementRef)focused;
      beforeText = [ReadText(pasteField) copy];
      CFTypeRef selected = nullptr;
      if (beforeText && AXUIElementCopyAttributeValue(pasteField, kAXSelectedTextRangeAttribute, &selected) == kAXErrorSuccess) {
        CFRange range;
        if (CFGetTypeID(selected) == AXValueGetTypeID() && AXValueGetValue((AXValueRef)selected, (AXValueType)kAXValueCFRangeType, &range)
            && range.location >= 0 && range.length >= 0 && range.location + range.length <= (CFIndex)[beforeText length]) {
          NSString *incoming = [[NSPasteboard generalPasteboard] stringForType:NSPasteboardTypeString];
          if (incoming) expectedText = [[beforeText stringByReplacingCharactersInRange:NSMakeRange(range.location, range.length) withString:incoming] copy];
        }
        CFRelease(selected);
      }
    }
    CFRelease(application);
    // Standard macOS text fields can replace only their selected text through
    // Accessibility. This avoids keyboard shortcut interception and never sets
    // the entire document. Unsupported editors use the targeted shortcut below.
    Boolean selectedTextSettable = false;
    if (pasteField && expectedText && AXUIElementIsAttributeSettable(pasteField, kAXSelectedTextAttribute, &selectedTextSettable) == kAXErrorSuccess && selectedTextSettable) {
      NSString *incoming = [[NSPasteboard generalPasteboard] stringForType:NSPasteboardTypeString];
      if (incoming && AXUIElementSetAttributeValue(pasteField, kAXSelectedTextAttribute, (CFStringRef)incoming) == kAXErrorSuccess)
        return Bool(env, true);
    }
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStatePrivate);
    CGEventRef down = CGEventCreateKeyboardEvent(source, 0x09, true);
    CGEventRef up = CGEventCreateKeyboardEvent(source, 0x09, false);
    if (!down || !up) {
      if (down) CFRelease(down); if (up) CFRelease(up); if (source) CFRelease(source);
      return Fail(env, "EVENT_FAILED", "Mac-en kunne ikke opprette innlimingstasten.");
    }
    CGEventSetFlags(down, kCGEventFlagMaskCommand);
    CGEventSetFlags(up, kCGEventFlagMaskCommand);
    // Deliver to the captured receiving process, rather than the global session.
    CGEventPostToPid(pid, down);
    usleep(8000);
    CGEventPostToPid(pid, up);
    CFRelease(down); CFRelease(up); if (source) CFRelease(source);
    return Bool(env, true);
  }
}
static napi_value Verify(napi_env env, napi_callback_info info) {
  @autoreleasepool {
    NSString *after = ReadText(pasteField);
    const char *state = "unverified";
    if (after && expectedText && [after isEqualToString:expectedText]) state = "verified";
    else if (after && beforeText && [after isEqualToString:beforeText]) state = "unchanged";
    napi_value result; napi_create_string_utf8(env, state, NAPI_AUTO_LENGTH, &result);
    ClearCheck(); return result;
  }
}
static napi_value OpenTestDocument(napi_env env, napi_callback_info info) {
  size_t argc = 1; napi_value argv[1]; napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  char filename[4096]; size_t length = 0;
  if (!argc || napi_get_value_string_utf8(env, argv[0], filename, sizeof(filename), &length) != napi_ok || length >= sizeof(filename) - 1)
    return Fail(env, "INVALID_TEST_PATH", "Kunne ikke åpne testdokumentet.");
  @autoreleasepool {
    NSWorkspaceOpenConfiguration *configuration = [NSWorkspaceOpenConfiguration configuration];
    configuration.activates = YES;
    [[NSWorkspace sharedWorkspace] openURLs:@[[NSURL fileURLWithPath:[NSString stringWithUTF8String:filename]]]
      withApplicationAtURL:[NSURL fileURLWithPath:@"/System/Applications/TextEdit.app"]
      configuration:configuration completionHandler:nil];
  }
  return Bool(env, true);
}
static napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
    {"status", nullptr, Status, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"paste", nullptr, Paste, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"verify", nullptr, Verify, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"openTestDocument", nullptr, OpenTestDocument, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 2, properties); return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
