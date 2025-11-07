export default function Skeleton({ height = 20 }) {
  return (
    <div
      style={{ height }}
      className="animate-pulse bg-gray-300 rounded w-full"
    ></div>
  );
}
