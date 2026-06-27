export default function ColorStripe() {
  return (
    <div className="h-[6px] w-full flex">
      <div className="flex-1 bg-[#C8102E]" />
      <div className="flex-1 bg-white border-y border-[#E5E5E5]" />
      <div className="flex-1 bg-[#1A3A6B]" />
      <div className="flex-1 bg-[#C8102E]" />
      <div className="flex-1 bg-white border-y border-[#E5E5E5]" />
      <div className="flex-1 bg-[#1A3A6B]" />
    </div>
  )
}
