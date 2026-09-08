export function formatDate(date: string | Date): string {
    const value = typeof date === "string" ? new Date(date) : date;

    if (Number.isNaN(value.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}
