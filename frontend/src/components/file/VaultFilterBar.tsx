import Button from "../ui/Button";

export type VaultSortOption =
    | "NEWEST"
    | "OLDEST"
    | "NAME_ASC"
    | "NAME_DESC"
    | "SIZE_ASC"
    | "SIZE_DESC";

type VaultFilterBarProps = {
    searchQuery: string;
    sortOption: VaultSortOption;
    totalFiles: number;
    filteredFiles: number;
    onSearchChange: (value: string) => void;
    onSortOptionChange: (value: VaultSortOption) => void;
    onClearFilters: () => void;
};

export default function VaultFilterBar({
    searchQuery,
    sortOption,
    totalFiles,
    filteredFiles,
    onSearchChange,
    onSortOptionChange,
    onClearFilters,
}: VaultFilterBarProps) {
    const hasActiveFilter =
        searchQuery.trim() !== "" || sortOption !== "NEWEST";

    return (
        <div className="vault-controls">
            <div className="filter-grid">
                <label className="filter-group">
                    <span>Search File</span>
                    <input
                        type="text"
                        placeholder="Search filenames..."
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </label>

                <label className="filter-group">
                    <span>Sort By</span>
                    <select
                        value={sortOption}
                        onChange={(event) =>
                            onSortOptionChange(event.target.value as VaultSortOption)
                        }
                    >
                        <option value="NEWEST">Newest First</option>
                        <option value="OLDEST">Oldest First</option>
                        <option value="NAME_ASC">Name A-Z</option>
                        <option value="NAME_DESC">Name Z-A</option>
                        <option value="SIZE_ASC">Smallest Size</option>
                        <option value="SIZE_DESC">Largest Size</option>
                    </select>
                </label>
            </div>

            <div className="vault-summary">
                <span>
                    Showing <strong>{filteredFiles}</strong> of{" "}
                    <strong>{totalFiles}</strong> files
                </span>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilter}
                >
                    Clear Filters
                </Button>
            </div>
        </div>
    );
}
