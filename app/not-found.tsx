import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-slate-100 p-8 text-center">
      <h2 className="text-3xl font-black text-rose-500 mb-2">404 - 页面未找到</h2>
      <p className="text-sm text-slate-400 mb-6">您访问的页面不存在或已被移动</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all"
      >
        返回工作台首页
      </Link>
    </div>
  );
}
