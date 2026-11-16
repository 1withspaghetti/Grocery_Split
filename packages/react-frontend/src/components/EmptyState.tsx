import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description?: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
	return (
		<Card className="items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm">
			<Icon aria-hidden="true" className="size-8 text-primary" />
			<h2 className="font-heading text-lg font-semibold">{title}</h2>
			{description && <p className="text-sm text-muted-foreground">{description}</p>}
		</Card>
	);
}

export default EmptyState;
