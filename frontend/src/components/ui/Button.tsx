import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger";
};

export default function Button({
    children,
    variant = "primary",
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button className={`btn btn-${variant} ${className}`} {...props}>
            {children}
        </button>
    );
}