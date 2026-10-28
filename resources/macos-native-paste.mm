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
static napi_value Dispatched(napi_env env, const char *method, pid_t pid) {
  napi_value result, value; napi_create_object(env, &result);
  napi_set_named_property(env, result, "posted", Bool(env, true));
  napi_create_string_utf8(env, method, NAPI_AUTO_LENGTH, &value);
  napi_set_named_property(env, result, "method", value);
  napi_create_int32(env, pid, &value);
  napi_set_named_property(env, result, "targetPid", value);
  return result;
}
static napi_value Fail(napi_env env, const char *code, const char *message) {
  napi_throw_error(env, code, message); return nullptr;
}
static napi_value Status(napi_env env, napi_callback_info info) {
  napi_value result; napi_create_object(env, &result);
  napi_set_named_property(env, result, "trusted", Bool(env, AXIsProcessTrusted()));
  napi_set_named_property(env, result, "canPost", Bool(env, CGPreflightPostEventAccess()));
  @autoreleasepool {
    NSRunningApplication *editor = [[NSRunningApplication runningApplicationsWithBundleIdentifier:@"com.apple.TextEdit"] firstObject];
    napi_value pid; napi_create_int64(env, editor ? editor.processIdentifier : 0, &pid);
    napi_set_named_property(env, result, "testTargetPid", pid);
  }
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
    // Use the same normal paste path in every editor, including our TextEdit
    // test. AX is read only for verification, never for replacing document text.
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStatePrivate);
    CGEventRef down = CGEventCreateKeyboardEvent(source, 0x09, true);
    CGEventRef up = CGEventCreateKeyboardEvent(source, 0x09, false);
    if (!down || !up) {
      if (down) CFRelease(down); if (up) CFRelease(up); if (source) CFRelease(source);
      return Fail(env, "EVENT_FAILED", "Mac-en kunne ikke opprette innlimingstasten.");
    }
    CGEventSetFlags(down, kCGEventFlagMaskCommand);
    CGEventSetFlags(up, kCGEventFlagMaskCommand);
    // Chromium routes keyboard input through the session's focused window.
    // Posting to its browser-process PID can leave the clipboard populated but
    // never reach the renderer's editor. Use the standard macOS session route,
    // from this authorized app process, after checking focus again.
    NSRunningApplication *current = [[NSWorkspace sharedWorkspace] frontmostApplication];
    if (!current || [current processIdentifier] != pid) {
      CFRelease(down); CFRelease(up); if (source) CFRelease(source);
      ClearCheck();
      return Fail(env, "TARGET_CHANGED", "Målprogrammet ble endret før innsetting. Teksten er beholdt i utklippstavlen.");
    }
    CGEventPost(kCGSessionEventTap, down);
    usleep(8000);
    CGEventPost(kCGSessionEventTap, up);
    CFRelease(down); CFRelease(up); if (source) CFRelease(source);
    return Dispatched(env, "session-command-v", pid);
  }
}
static napi_value Verify(napi_env env, napi_callback_info info) {
  size_t argc = 1; napi_value argv[1]; bool finalCheck = true;
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc) napi_get_value_bool(env, argv[0], &finalCheck);
  @autoreleasepool {
    NSString *after = ReadText(pasteField);
    const char *state = "unverified";
    if (after && expectedText && [after isEqualToString:expectedText]) state = "verified";
    else if (after && beforeText && [after isEqualToString:beforeText]) state = "unchanged";
    napi_value result; napi_create_string_utf8(env, state, NAPI_AUTO_LENGTH, &result);
    if (finalCheck || strcmp(state, "verified") == 0 || strcmp(state, "unverified") == 0) ClearCheck();
    return result;
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
  napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties); return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
