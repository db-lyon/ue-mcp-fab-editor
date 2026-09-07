using UnrealBuildTool;

public class FabEditor : ModuleRules
{
    public FabEditor(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new[] { "Core", "CoreUObject", "Json" });
        PrivateDependencyModuleNames.AddRange(new[] {
            "Engine", "UnrealEd", "Slate", "SlateCore", "Projects",
            "AssetRegistry", "WebBrowser", "UE_MCP_Bridge"
        });
    }
}
