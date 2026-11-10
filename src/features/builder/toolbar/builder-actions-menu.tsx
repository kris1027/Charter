import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResetDialog } from '@/features/builder/toolbar/reset-dialog';
import { useMenuActionFocus } from '@/features/builder/use-menu-action-focus';
import { EllipsisVertical, RotateCcw, Save, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type BuilderActionsMenuProps = {
    isImporting: boolean;
    isSaving: boolean;
    onLoadPdf: () => void;
    onSave: () => void;
    onReset: () => void;
};

const ITEM_CLASS = 'cursor-pointer gap-2';

// Load PDF, Save and Reset behind one icon button, so the toolbar fits a phone (spec 0012, AC-7,
// AC-8). Reset's dialog lives outside the menu; focus returns to this trigger when it closes
export const BuilderActionsMenu = ({
    isImporting,
    isSaving,
    onLoadPdf,
    onSave,
    onReset,
}: BuilderActionsMenuProps) => {
    const { t } = useTranslation();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [resetOpen, setResetOpen] = useState(false);
    // Reset opens a dialog, so the closing menu leaves focus to it
    const menuFocus = useMenuActionFocus();

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        ref={triggerRef}
                        type='button'
                        variant='outline'
                        size='icon'
                        aria-label={t('builder.actions.label')}
                    >
                        <EllipsisVertical aria-hidden='true' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align='end'
                    className='w-44'
                    onCloseAutoFocus={menuFocus.onCloseAutoFocus}
                >
                    <DropdownMenuItem
                        className={ITEM_CLASS}
                        disabled={isImporting}
                        onSelect={onLoadPdf}
                    >
                        <Upload className='size-4' aria-hidden='true' />
                        {isImporting ? t('builder.loading') : t('builder.loadPdf')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className={ITEM_CLASS} disabled={isSaving} onSelect={onSave}>
                        <Save className='size-4' aria-hidden='true' />
                        {isSaving ? t('builder.saving') : t('builder.save')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className={`${ITEM_CLASS} text-destructive focus:text-destructive`}
                        onSelect={menuFocus.placesFocus(() => setResetOpen(true))}
                    >
                        <RotateCcw className='size-4' aria-hidden='true' />
                        {t('builder.reset')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ResetDialog
                open={resetOpen}
                onOpenChange={setResetOpen}
                onConfirm={onReset}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    triggerRef.current?.focus();
                }}
            />
        </>
    );
};
