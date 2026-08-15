import type { ReactNode } from "react";

type StatusCardProps = {
	children: ReactNode;
	error?: boolean;
};

export function StatusCard({ children, error = false }: StatusCardProps) {
	return <main className={error ? "card error" : "card"}>{children}</main>;
}
