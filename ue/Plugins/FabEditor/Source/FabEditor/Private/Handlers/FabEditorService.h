#pragma once

#include "CoreMinimal.h"
#include "Dom/JsonObject.h"
#include "UObject/Object.h"
#include "FabEditorService.generated.h"

// Native request correlation does not make page-originated data trustworthy.
// This callback is not independent entitlement verification.
UCLASS(Transient)
class UFabEditorBrowserReply : public UObject
{
	GENERATED_BODY()
public:
	FString OperationId;
	UFUNCTION()
	void Complete(const FString& Nonce, const FString& Json);
};

namespace FabEditorPlugin
{
	void Register();
	void Shutdown();
	TSharedPtr<FJsonValue> Execute(const TSharedPtr<FJsonObject>& Params);
	void CompleteBrowser(UFabEditorBrowserReply* Sender, const FString& OperationId, const FString& Nonce, const FString& Json);

	// Pure helpers also exercised by the native automation tests.
	bool AccountFromToken(const FString& Token, FString& OutAccount);
	bool IsFabUrl(const FString& Url);
	bool ParseLibraryPage(const TSharedPtr<FJsonObject>& Page,
		TArray<TSharedPtr<FJsonObject>>& OutItems, FString& OutCursor, FString& OutError);
}
