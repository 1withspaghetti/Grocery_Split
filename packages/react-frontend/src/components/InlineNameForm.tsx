import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface InlineNameFormProps {
	placeholder: string;
	onCreate: (name: string) => void;
	onCancel: () => void;
	isPending: boolean;
	error?: string;
}

function InlineNameForm({
	placeholder,
	onCreate,
	onCancel,
	isPending,
	error
}: InlineNameFormProps) {
	const [name, setName] = useState("");
	const input = useRef<HTMLInputElement>(null);

	useEffect(() => input.current?.focus(), []);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (name.trim()) onCreate(name.trim());
	}

	return (
		<Card className="rounded-2xl p-3 shadow-sm sm:p-4">
			<form className="flex flex-col gap-3" onSubmit={submit}>
				<Input
					ref={input}
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder={placeholder}
					maxLength={128}
					aria-label={placeholder}
					className="h-11 flex-1 rounded-xl"
				/>
				<div className="flex justify-center gap-2">
					<Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending || !name.trim()}>
						{isPending ? "Adding…" : "Add"}
					</Button>
				</div>
			</form>
			{error && (
				<p role="alert" className="mt-2 text-sm text-destructive">
					{error}
				</p>
			)}
		</Card>
	);
}

export default InlineNameForm;
