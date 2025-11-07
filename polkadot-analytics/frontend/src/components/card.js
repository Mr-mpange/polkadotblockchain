export default function Card({ children }) {
  return (
    <div className="p-4 border rounded-md shadow-sm bg-white">
      {children}
    </div>
  );
}
