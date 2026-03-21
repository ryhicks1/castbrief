import AgentShell from "@/components/layout/AgentShell";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgentShell>{children}</AgentShell>;
}
