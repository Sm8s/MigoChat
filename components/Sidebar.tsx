// Ergänzung für deine Sidebar.tsx
// Zeige unten links dein Profil an
<div className="p-4 bg-[#232428] mt-auto flex items-center gap-3">
  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">
    {myProfile?.display_name[0].toUpperCase()}
  </div>
  <div className="flex flex-col">
    <span className="text-white text-sm font-medium">{myProfile?.display_name}</span>
    <span className="text-gray-400 text-[10px] leading-none">{myProfile?.migo_tag}</span>
  </div>
</div>