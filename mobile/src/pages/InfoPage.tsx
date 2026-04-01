import { BodyText, Card, Heading, Screen } from "../components/ui";

export function InfoPage() {
  return (
    <Screen>
      <Card>
        <Heading>What This App Does</Heading>
        <BodyText>
          A simple forum where you can register, log in, create discussions, comment, view profiles, and pretend you
          are being very productive.
        </BodyText>
        <BodyText>
          You can also post anonymously, close your own threads, and delete your account when your hot take does not
          land.
        </BodyText>
      </Card>
    </Screen>
  );
}
