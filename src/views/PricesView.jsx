import { useState } from "react";
import Icon from "../assets/Icon";
import { PRICE_SECTIONS } from "../constants/prices";

export default function PricesView() {
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim().toLowerCase();
  const filteredSections = query === ""
    ? PRICE_SECTIONS
    : PRICE_SECTIONS
        .map((s) => ({
          ...s,
          items: s.items.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              (item.tags?.some((t) => t.includes(query)) ?? false),
          ),
        }))
        .filter((s) => s.items.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Suggested Prices</h1>
          <p className="text-sm text-text-muted mt-0.5">Base prices — actual cost may vary depending on coat, size, and temperament</p>
        </div>
        <div className="relative w-72">
          <Icon
            name="search"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by breed or service…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
          />
        </div>
      </div>

      {/* Content */}
      {filteredSections.length === 0 ? (
        <div className="bg-background-card border border-border rounded-2xl shadow-card py-20 text-center">
          <Icon name="dollar" className="w-10 h-10 mx-auto mb-3 text-border" />
          <p className="text-sm font-medium text-text-secondary">No prices found</p>
          <p className="text-xs text-text-muted mt-1">Try a different breed or service name</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden"
            >
              {/* Section header */}
              <div className="bg-background-sidebar px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-text-primary">{section.title}</p>
                {section.subtitle && (
                  <p className="text-xs text-text-muted mt-0.5">{section.subtitle}</p>
                )}
              </div>

              {/* Item rows */}
              <div className="divide-y divide-border">
                {section.items.map((item) => (
                  <div key={item.name} className="px-5 py-2.5 flex items-center justify-between gap-4">
                    <span className="text-sm text-text-secondary">{item.name}</span>
                    <span className="text-sm font-medium text-text-primary whitespace-nowrap">{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Add-on line */}
              {section.addOn && (
                <p className="px-5 py-2 text-xs text-text-muted italic border-t border-border">
                  {section.addOn}
                </p>
              )}

              {/* Note line */}
              {section.note && (
                <p className="px-5 pb-3 text-xs text-text-muted italic">
                  {section.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
