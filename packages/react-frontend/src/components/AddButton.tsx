import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddButtonProps {
	// Screen reader label, e.g. "Create a group"
	label: string;
	// Lets a list insert its draft directly instead of navigating away.
	onClick: () => void;
}

// Round "+" button pinned to the bottom right of a page
function AddButton({ label, onClick }: AddButtonProps) {
	return (
		<div className="mt-auto flex justify-end pt-4">
			<Button
				size="icon"
				aria-label={label}
				onClick={onClick}
				className="size-14 rounded-full shadow-md">
				<Plus aria-hidden="true" className="size-7" />
			</Button>
		</div>
	);
}

export default AddButton;
