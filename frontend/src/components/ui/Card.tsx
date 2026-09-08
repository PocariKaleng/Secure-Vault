import type { ReactNode } from "react";

type CardProps = {
    title?: string;
    description?: string;
    children: ReactNode;
};

export default function Card({ title, description, children }: CardProps) {
    return (
        <section className="card">
            {(title || description) && (
                <div className="card-header">
                    {title && <h2>{title}</h2>}
                    {description && <p>{description}</p>}
                </div>
            )}

            <div>{children}</div>
        </section>
    );
}