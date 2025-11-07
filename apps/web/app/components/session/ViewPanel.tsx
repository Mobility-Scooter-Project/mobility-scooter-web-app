export function ViewPanel({ sessionId }: { sessionId: number }) {
  return (
    <main className="flex flex-col h-full bg-blue-500 p-4">
      <header>
        <h1 className="text-white text-lg font-bold">
          Viewing Session {sessionId}
        </h1>
      </header>
    </main>
  );
}
