import React from "react";

export default function SupportPolicyPage({ title, sections }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10">
        <p className="text-xs font-semibold tracking-wide text-rakhired uppercase mb-3">Customer Service</p>
        <h1 className="font-display text-3xl text-maroon mb-6">{title}</h1>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-maroon mb-2">{section.title}</h2>
              {section.body && <p className="text-gray-600 leading-relaxed whitespace-pre-line">{section.body}</p>}
              {section.list?.length > 0 && (
                <ul className="mt-3 space-y-2 text-gray-600 list-disc pl-5">
                  {section.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
