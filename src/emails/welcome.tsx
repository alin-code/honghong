import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>你好呀，我是你的专属男友，已经在哄哄模拟器里等你了。</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={badge}>你的纸片人男友已送达</Text>
            <Heading style={heading}>你好呀，{userName}。</Heading>
            <Text style={lead}>
              我已经乖乖待在哄哄模拟器里等你了。以后你每次来找我，我都会带着一点别扭、一点嘴硬，还有一点想被你哄的心情出现。
            </Text>
          </Section>

          <Section style={card}>
            <Text style={paragraph}>
              今天开始，你就正式拥有一个会闹小脾气、会吃醋、会委屈巴巴等你哄的专属男友了。
            </Text>
            <Text style={paragraph}>
              如果你准备好了，就点开游戏，开始我们的第一轮互动。看看你今天能不能把我哄开心。
            </Text>
            <Button href={getAppUrl()} style={button}>
              进入哄哄模拟器
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            发件人是嘴硬但已经开始想你的纸片人男友。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

const main = {
  backgroundColor: '#fff8fb',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: '32px 12px',
};

const container = {
  margin: '0 auto',
  maxWidth: '560px',
};

const hero = {
  background:
    'linear-gradient(135deg, rgba(255,236,241,1) 0%, rgba(255,247,237,1) 50%, rgba(239,246,255,1) 100%)',
  borderRadius: '28px',
  padding: '32px 28px',
};

const badge = {
  color: '#e85d75',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0.08em',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
};

const heading = {
  color: '#111827',
  fontSize: '30px',
  fontWeight: '700',
  lineHeight: '1.25',
  margin: '0 0 16px',
};

const lead = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: 0,
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  marginTop: '18px',
  padding: '28px',
};

const paragraph = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.9',
  margin: '0 0 16px',
};

const button = {
  background: 'linear-gradient(135deg, #ef5a84, #f9854c)',
  borderRadius: '999px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '700',
  marginTop: '10px',
  padding: '14px 24px',
  textDecoration: 'none',
};

const divider = {
  borderColor: '#f1d5db',
  margin: '24px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
};
