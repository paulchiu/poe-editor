import type { ReactElement } from 'react'
import { Wand2, Save, ChevronDown } from 'lucide-react'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconPicker } from './IconPicker'
import type { TransformationPipeline } from './types'

interface SplitButtonAction {
  id: string
  label: string
  icon: typeof Save
  handler: () => void
}

interface TransformerDialogHeaderProps {
  editPipeline?: TransformationPipeline | null
  initialPreviewText?: string
  pipelineName: string
  onPipelineNameChange: (name: string) => void
  pipelineIcon: string
  onPipelineIconChange: (icon: string) => void
  onSave: () => void
  splitButtonActions: SplitButtonAction[]
  primaryActionId: string
}

/**
 * Header component for the transformer dialog with title, name input, icon picker, and actions.
 * @param props - Component props
 * @returns Transformer dialog header component
 */
export function TransformerDialogHeader({
  editPipeline,
  initialPreviewText,
  pipelineName,
  onPipelineNameChange,
  pipelineIcon,
  onPipelineIconChange,
  onSave,
  splitButtonActions,
  primaryActionId,
}: TransformerDialogHeaderProps): ReactElement {
  const primaryAction = splitButtonActions.find((a) => a.id === primaryActionId)!
  const dropdownActions = splitButtonActions.filter((a) => a.id !== primaryActionId)

  return (
    <DialogHeader className="px-4 py-3 border-b shrink-0 flex flex-row flex-wrap sm:flex-nowrap items-center justify-between gap-y-3 sm:gap-y-0 space-y-0 pr-12">
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        <DialogTitle>{editPipeline ? 'Edit Transformer' : 'Transform Selection'}</DialogTitle>
      </div>
      <DialogDescription className="sr-only">
        Create and edit custom text transformation pipelines
      </DialogDescription>

      <div className="flex items-center gap-2 ml-auto sm:ml-0 order-2 sm:order-3">
        {initialPreviewText ? (
          <div className="flex items-center -space-x-px">
            <Button
              variant="ghost"
              onClick={primaryAction.handler}
              className="h-10 rounded-r-none border-r"
            >
              {primaryAction.label}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 rounded-l-none">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownActions.map((action) => (
                  <DropdownMenuItem key={action.id} onClick={action.handler}>
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button variant="ghost" onClick={onSave} className="h-10">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto order-3 sm:order-2 sm:mr-4">
        <IconPicker value={pipelineIcon} onChange={onPipelineIconChange} />
        <Input
          value={pipelineName}
          onChange={(e) => onPipelineNameChange(e.target.value)}
          className="flex-1 sm:w-40 md:w-64 h-10"
          placeholder="Pipeline Name (e.g. Clean & Sort)"
        />
      </div>
    </DialogHeader>
  )
}
