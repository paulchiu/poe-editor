import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RenameDialog } from './RenameDialog'

describe('RenameDialog', () => {
  it('renders content when open', () => {
    render(
      <RenameDialog 
        open={true} 
        onOpenChange={() => {}} 
        currentName="test.md" 
        onRename={() => {}} 
      />
    )
    
    expect(screen.getByText('Rename Document')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test.md')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <RenameDialog 
        open={false} 
        onOpenChange={() => {}} 
        currentName="test.md" 
        onRename={() => {}} 
      />
    )
    
    expect(screen.queryByText('Rename Document')).not.toBeInTheDocument()
  })

  it('updates input value on change', () => {
    render(
      <RenameDialog 
        open={true} 
        onOpenChange={() => {}} 
        currentName="test.md" 
        onRename={() => {}} 
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'newname.md' } })
    
    expect(input).toHaveValue('newname.md')
  })

  it('calls onRename and onOpenChange when form is submitted', () => {
    const onRename = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <RenameDialog 
        open={true} 
        onOpenChange={onOpenChange} 
        currentName="test.md" 
        onRename={onRename} 
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'newname.md' } })
    
    const submitButton = screen.getByRole('button', { name: 'Rename' })
    fireEvent.click(submitButton)
    
    expect(onRename).toHaveBeenCalledWith('newname.md')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn()

    render(
      <RenameDialog 
        open={true} 
        onOpenChange={onOpenChange} 
        currentName="test.md" 
        onRename={() => {}} 
      />
    )
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelButton)
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables submit button when input is empty or whitespace', () => {
    render(
      <RenameDialog 
        open={true} 
        onOpenChange={() => {}} 
        currentName="test.md" 
        onRename={() => {}} 
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '' } })
    
    const submitButton = screen.getByRole('button', { name: 'Rename' })
    expect(submitButton).toBeDisabled()
    
    fireEvent.change(input, { target: { value: '   ' } })
    expect(submitButton).toBeDisabled()
  })
})
