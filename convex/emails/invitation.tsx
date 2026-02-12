import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InvitationEmailProps {
  organisationName: string;
  inviterName: string;
  url: string;
}

export default function InvitationEmail({
  organisationName,
  inviterName,
  url,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organisationName} on Axis</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={text}>Hi there,</Text>
            <Text style={text}>
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{organisationName}</strong> on Axis.
            </Text>
            <Text style={text}>
              Axis is a task management and time tracking platform that helps
              teams collaborate effectively.
            </Text>
            <Button style={button} href={url}>
              Accept Invitation
            </Button>
            <Text style={text}>
              This invitation will expire in 7 days. If you don't have an
              account yet, you'll be able to create one when you click the
              button above.
            </Text>
            <Text style={text}>
              If you didn't expect this invitation, you can safely ignore this
              email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
  fontWeight: "300",
  color: "#404040",
  lineHeight: "26px",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "4px",
  color: "#fff",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "210px",
  padding: "14px 7px",
  margin: "20px auto",
};
