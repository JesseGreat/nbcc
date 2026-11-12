import { Body, Button, Container, Head, Hr, Html, Img, Preview, Section, Text } from "react-email";
import { ORG } from "@/lib/config";
import { publicEnv } from "@/lib/env";

const colors = {
  navy: "#0B2545",
  gold: "#C9A227",
  text: "#0F172A",
  muted: "#526075",
  bg: "#F7F8FA",
  border: "#E2E8F0",
};

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, margin: 0, padding: "24px 0", fontFamily: "Inter, Segoe UI, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, width: "100%", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: 12, overflow: "hidden", border: `1px solid ${colors.border}` }}>
          <Section style={{ backgroundColor: "#ffffff", padding: "16px 24px 8px", textAlign: "center" }}>
            {/* Absolute URL: email clients load it from the deployed portal. */}
            <Img src={`${publicEnv.appUrl}/brand/nbcc-logo.png`} alt={ORG.name} width="120" style={{ margin: "0 auto", height: "auto" }} />
          </Section>
          <Section style={{ backgroundColor: colors.navy, padding: "14px 24px" }}>
            <Text style={{ margin: 0, color: "#ffffff", fontSize: 18, fontWeight: 800, letterSpacing: 0.5 }}>
              {ORG.shortName} <span style={{ color: colors.gold, fontWeight: 600 }}>Member Portal</span>
            </Text>
            <Text style={{ margin: "2px 0 0", color: "#C9D3E0", fontSize: 12 }}>{ORG.name}</Text>
          </Section>
          <Section style={{ padding: "24px" }}>{children}</Section>
          <Hr style={{ borderColor: colors.border, margin: 0 }} />
          <Section style={{ padding: "16px 24px" }}>
            <Text style={{ margin: 0, color: colors.muted, fontSize: 12, lineHeight: "18px" }}>
              You are receiving this email because of your membership with the {ORG.name}. Questions? Contact{" "}
              {ORG.supportEmail}.
            </Text>
            <Text style={{ margin: "8px 0 0", color: colors.muted, fontSize: 11 }}>Powered by {ORG.poweredBy}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 12px", color: colors.navy, fontSize: 22, fontWeight: 700, lineHeight: "28px" }}>{children}</Text>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 14px", color: colors.text, fontSize: 15, lineHeight: "24px" }}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: "0 0 12px", color: colors.muted, fontSize: 13, lineHeight: "20px" }}>{children}</Text>;
}

export function CTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 20px" }}>
      <Button
        href={href}
        style={{ backgroundColor: colors.navy, color: "#ffffff", borderRadius: 8, padding: "14px 22px", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block" }}
      >
        {children}
      </Button>
    </Section>
  );
}

/** Two-column key/value list that stays readable on narrow screens. */
export function Details({ rows }: { rows: [string, string][] }) {
  return (
    <Section style={{ backgroundColor: colors.bg, borderRadius: 8, padding: "12px 16px", margin: "4px 0 18px" }}>
      {rows.map(([k, v]) => (
        <Text key={k} style={{ margin: "4px 0", fontSize: 14, lineHeight: "20px", color: colors.text }}>
          <span style={{ color: colors.muted }}>{k}: </span>
          <strong>{v}</strong>
        </Text>
      ))}
    </Section>
  );
}
