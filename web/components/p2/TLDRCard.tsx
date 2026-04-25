interface TLDRCardProps {
  tldr: string;
}

export default function TLDRCard({ tldr }: TLDRCardProps) {
  return (
    <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
        Session summary
      </h2>
      <p className="mt-3 text-base leading-7 text-[#17211b]">{tldr}</p>
    </div>
  );
}
