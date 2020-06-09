import { pluginRegisterCommand } from "@/plugin"
import { commandDefinition } from "@/association/command"
import type { FzfCommand } from "@/type"
import { syncVimVariable } from "@/plugin/sync-vim-variable"
import { generateOptions } from "@/fzf/option/generator"
import { fzfRunner } from "@/plugin/fzf-runner"
import { parseAddFzfArgs, parseProcessors, parseEmptySourceFuncArgs } from "@/args"
import { store, dispatch } from "@/store"
import { saveStore } from "@/module/persist"
import { createGlobalVariableSelector } from "@/module/vim-variable"
import { executeCommandModule } from "@/module/execute-command"
import { handlerName } from "@/const/fzf-handler"

const registerCommand = ({
  commandName,
  sourceFunc,
  sourceFuncArgsParser,
  vimCommandOptions,
  defaultFzfOptionFunc,
  defaultProcessors,
  enableDevIcons,
  optionalUnnecessaryPrefixLength
}: FzfCommand) => {
  pluginRegisterCommand(
    commandName,
    async ([args]: Array<string>) => {
      await syncVimVariable()

      const addFzfOptions = parseAddFzfArgs(args)
      const processorsName = parseProcessors(args)
      const fzfOptions = await generateOptions({
        fzfCommandDefaultOptions: defaultFzfOptionFunc(),
        defaultProcessors,
        userProcessorsName: processorsName,
        userOptions: addFzfOptions
      })
      const sourceFuncArgs = sourceFuncArgsParser ? sourceFuncArgsParser(args) : parseEmptySourceFuncArgs(args)

      const globalVariableSelector = createGlobalVariableSelector(store)
      dispatch(
        executeCommandModule.actions.setExecuteCommand({
          commandName,
          options: {
            processorsName,
            enableDevIcons: enableDevIcons && globalVariableSelector("fzfPreviewUseDevIcons"),
            optionalUnnecessaryPrefixLength
          }
        })
      )
      await dispatch(saveStore())

      fzfRunner({
        source: await sourceFunc(sourceFuncArgs),
        handler: handlerName,
        options: fzfOptions
      })
    },
    vimCommandOptions
  )
}

export const registerCommands = () => {
  commandDefinition.forEach((command) => {
    registerCommand(command)
  })
}
