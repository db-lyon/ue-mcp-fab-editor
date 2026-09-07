#include "Modules/ModuleManager.h"
#include "Handlers/FabEditorService.h"

class FFabEditorModule final : public IModuleInterface
{
public:
    void StartupModule() override { FabEditorPlugin::Register(); }
    void ShutdownModule() override { FabEditorPlugin::Shutdown(); }
};

IMPLEMENT_MODULE(FFabEditorModule, FabEditor)
