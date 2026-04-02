"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ServiceCardProps {
  service: {
    service_id: string; name: string; description?: string; price: number;
    serviceCategory?: string; deliveryTypes?: string[];
    provider?: { business_name?: string; provider_id?: string };
  };
}

const deliveryLabels: Record<string, string> = {
  home: "בית", clinic: "מרפאה", hospital: "בית חולים", virtual: "אונליין", delivery: "משלוח",
};

export default function ServiceCard({ service: s }: ServiceCardProps) {
  return (
    <Card className="p-6 hover-lift group" data-testid={`service-${s.service_id}`}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {s.serviceCategory && <Badge variant="teal">{s.serviceCategory}</Badge>}
        {s.deliveryTypes?.map((d) => <Badge key={d} variant="outline" className="text-[10px]">{deliveryLabels[d] || d}</Badge>)}
      </div>
      <h3 className="font-heading font-semibold text-lg text-carefd-navy mb-2 group-hover:text-carefd-teal transition-colors">
        {s.name}
      </h3>
      {s.description && <p className="text-sm text-carefd-gray mb-4 line-clamp-2 leading-relaxed">{s.description}</p>}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-xl font-heading font-bold text-carefd-navy">{"\u20AA"}{s.price}</span>
          {s.provider && <p className="text-xs text-carefd-gray mt-0.5">{s.provider.business_name}</p>}
        </div>
        <Button size="sm" asChild>
          <Link href={`/book/${s.service_id}`}>הזמינו<ChevronLeft className="w-3 h-3 ms-1" /></Link>
        </Button>
      </div>
    </Card>
  );
}
