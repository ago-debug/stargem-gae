import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { InlineListEditor } from "./inline-list-editor";
import { ReactNode } from "react";

interface Props {
  listCode: string;
  listName: string;
  showColors?: boolean;
  trigger?: ReactNode;
  penninoType?: string;
}

export function InlineListEditorDialog({ listCode, listName, showColors, trigger, penninoType }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" size="icon" variant="ghost" className="h-5 w-5">
            <Edit className="w-3 h-3 text-slate-500" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px] p-0">
        <DialogHeader className="p-4 pb-0 hidden">
          <DialogTitle>Gestisci {listName}</DialogTitle>
          <DialogDescription>Aggiungi o rimuovi voci dalla lista.</DialogDescription>
        </DialogHeader>
        <div className="bg-background rounded-md w-full flex justify-center">
          <InlineListEditor listCode={listCode} listName={listName} showColors={showColors} penninoType={penninoType} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
