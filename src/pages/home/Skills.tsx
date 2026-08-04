import { type RefObject } from 'react';
import {
  ScrambleReveal,
  Heading,
  Link,
  List,
  ListItem,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHeadCell,
  TableRow,
  Text,
  Transition,
} from 'components';
import styles from './Skills.module.css';

interface SkillsProps {
  id: string;
  visible: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

export const Skills = ({ id, visible, sectionRef }: SkillsProps) => (
  <Section className={styles.skills} id={id} ref={sectionRef} as="section">
    <Transition in={visible} timeout={0}>
      {(transVisible: boolean) => (
        <div className={styles.inner}>
          <Heading
            level={2}
            as="h2"
            className={styles.title}
            data-visible={transVisible}
          >
            <ScrambleReveal text="Skills" start={transVisible} delay={300} />
          </Heading>

          <div className={styles.block} data-visible={transVisible}>
            <Heading level={4} as="h3" className={styles.blockHeading}>
              Tech
            </Heading>
            <Table>
              <TableBody>
                <TableRow>
                  <TableHeadCell>Languages</TableHeadCell>
                  <TableCell>JavaScript, TypeScript, Java, SQL, GraphQL, HTML, CSS.</TableCell>
                </TableRow>
                <TableRow>
                  <TableHeadCell>Frameworks &amp; Libraries</TableHeadCell>
                  <TableCell>
                    React, Next.js, Redux, Storybook, Angular, D3.js, Node.js, Spring Boot.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHeadCell>Infrastructure &amp; Tooling</TableHeadCell>
                  <TableCell>
                    AWS (SQS, EventBridge, Lambda, Cognito), GraphQL APIs, WebSockets, Splunk,
                    Datadog, Webpack.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHeadCell>Domains</TableHeadCell>
                  <TableCell>
                    AI &amp; LLM Prototyping, UX Engineering, Design Systems &amp; Storybook,
                    Consumer Web Products, Identity &amp; Authentication.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHeadCell>Soft Skills</TableHeadCell>
                  <TableCell>Technical Leadership, Mentorship, Cross-org Collaboration.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className={styles.block} data-visible={transVisible}>
            <Heading level={4} as="h3" className={styles.blockHeading}>
              Development
            </Heading>
            <Text size="l" as="div">
              <List>
                <ListItem>
                  I use{' '}
                  <Link href="https://code.visualstudio.com/">Visual Studio Code</Link> as my text
                  editor, with the One Dark Pro Monokai Darker theme and Operator Mono as my
                  typeface of choice.
                </ListItem>
                <ListItem>
                  Google Chrome is my main browser for both development and general use.
                </ListItem>
                <ListItem>
                  <Link href="https://reactjs.org/">React</Link> is my front end Javascript library
                  of choice. The component-centric mental model is pretty quick and snappy for large
                  scale applications.
                </ListItem>
                <ListItem>
                  For 3D effects and image shaders I use{' '}
                  <Link href="https://threejs.org/">three.js</Link>. It has a bit of a learning
                  curve but you can do some really powerful stuff with it.
                </ListItem>
                <ListItem>
                  For CSS I&apos;ve used a myriad pre-processors and css-in-js solutions like
                  styled-components, but these days I&apos;m using vanilla CSS with{' '}
                  <Link href="https://postcss.org/">PostCSS</Link> to get upcoming CSS features
                  today.
                </ListItem>
                <ListItem>
                  For Javascript animations I use{' '}
                  <Link href="https://www.framer.com/motion/">Framer Motion</Link>, it&apos;s a
                  great way to add spring animations to React and three.js.
                </ListItem>
                <ListItem>
                  For building and testing UI components in isolation I use{' '}
                  <Link href="https://storybook.js.org/">Storybook</Link>.
                </ListItem>
              </List>
            </Text>
          </div>
        </div>
      )}
    </Transition>
  </Section>
);
