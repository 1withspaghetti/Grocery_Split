import { useId, useState, type FormEvent } from "react";
import type { validator } from "@grocery-split/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateNameFormProps {
	label: string;
	placeholder: string;
	description: string;
	schema: typeof validator.group | typeof validator.trip;
	onCreate: (name: string) => void;
	isPending: boolean;
	// Message from the last failed create, if any
	createError?: string;
}

function CreateNameForm({
	label,
	placeholder,
	description,
	schema,
	onCreate,
	isPending,
	createError
}: CreateNameFormProps) {
	const inputId = useId();
	const [name, setName] = useState("");
	const [error, setError] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const result = schema.safeParse({ name: name.trim() });
		if (!result.success) {
			setError("Enter a name to continue.");
			return;
		}
		onCreate(result.data.name);
	}

	return (
		<form noValidate className="flex flex-1 flex-col" onSubmit={handleSubmit}>
			<div className="flex min-h-72 flex-1 items-center px-6 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto w-full max-w-xl">
					<label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
						{label}
					</label>
					<Input
						id={inputId}
						name="name"
						value={name}
						onChange={(event) => {
							setName(event.target.value);
							setError("");
						}}
						placeholder={placeholder}
						required
						maxLength={128}
						autoComplete="off"
						aria-invalid={Boolean(error)}
						aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ""}`}
						className="h-14 rounded-2xl border-primary bg-card px-4 text-base shadow-sm md:text-base"
					/>
					<p id={`${inputId}-hint`} className="mt-3 text-sm leading-snug text-muted-foreground">
						{description}
					</p>
					{error && (
						<p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-destructive">
							{error}
						</p>
					)}
				</div>
			</div>
			<footer className="shrink-0 border-t p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
				<div className="mx-auto w-full max-w-xl">
					{createError && (
						<p role="alert" className="mb-3 text-center text-sm text-destructive">
							{createError}
						</p>
					)}
					<Button
						type="submit"
						disabled={isPending}
						className="h-14 w-full rounded-2xl text-base font-semibold">
						{isPending ? "Creating…" : "Create"}
					</Button>
				</div>
			</footer>
		</form>
	);
}

export default CreateNameForm;
