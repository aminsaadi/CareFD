import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title, icon: Icon }: { title: string; icon?: React.ElementType }) {
  const IconComp = Icon || Construction;
  return (
    <div>
      <h2 className="font-heading font-semibold text-2xl mb-6">ניהול {title}</h2>
      <Card className="p-10 text-center">
        <IconComp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">עמוד ניהול {title}</p>
        <p className="text-slate-300 text-sm mt-1">בבנייה</p>
      </Card>
    </div>
  );
}
