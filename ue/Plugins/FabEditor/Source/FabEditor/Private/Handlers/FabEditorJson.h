#pragma once
#include "CoreMinimal.h"
#include "Dom/JsonObject.h"
#include "Dom/JsonValue.h"

namespace FabEditorPlugin
{
inline TSharedPtr<FJsonObject> MCPSuccess()
{
    auto Result = MakeShared<FJsonObject>();
    Result->SetBoolField(TEXT("success"), true);
    return Result;
}
inline TSharedPtr<FJsonValue> MCPResult(TSharedPtr<FJsonObject> Result)
{
    return MakeShared<FJsonValueObject>(Result);
}
inline TSharedPtr<FJsonValue> MCPError(const FString& Error)
{
    auto Result = MakeShared<FJsonObject>();
    Result->SetBoolField(TEXT("success"), false);
    Result->SetStringField(TEXT("error"), Error);
    return MCPResult(Result);
}
inline FString OptionalString(const TSharedPtr<FJsonObject>& Params, const TCHAR* Key, const FString& Default = FString())
{
    FString Value; return Params && Params->TryGetStringField(Key, Value) ? Value : Default;
}
inline double OptionalNumber(const TSharedPtr<FJsonObject>& Params, const TCHAR* Key, double Default = 0)
{
    double Value; return Params && Params->TryGetNumberField(Key, Value) ? Value : Default;
}
inline int32 OptionalInt(const TSharedPtr<FJsonObject>& Params, const TCHAR* Key, int32 Default = 0)
{
    return static_cast<int32>(OptionalNumber(Params, Key, Default));
}
inline bool OptionalBool(const TSharedPtr<FJsonObject>& Params, const TCHAR* Key, bool Default = false)
{
    bool Value; return Params && Params->TryGetBoolField(Key, Value) ? Value : Default;
}
}
