import { Meta, ViewportPage } from 'components';
import {
  Heading,
  Link,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHeadCell,
  TableRow,
  Text,
} from 'refract-ui';
import { analyticsEvents, trackEvent } from 'utils/analytics';
import styles from './Skills.module.css';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Skills', href: '/skills' },
];

const trackToolLinkClick = (tool: string) => () =>
  trackEvent(analyticsEvents.skillsToolLinkClick, { tool });

export const Skills = () => (
  <ViewportPage title="Skills" breadcrumbs={breadcrumbs}>
    <Meta
      title="Skills"
      description="The languages, frameworks, infrastructure, and tools Param Mehta works with day to day."
    />
    <div className={styles.inner}>
      <div className={styles.block}>
        <Heading level={5} as="h2" className={styles.blockHeading}>
          Tech
        </Heading>
        <Table>
          <TableBody>
            <TableRow>
              <TableHeadCell>Languages</TableHeadCell>
              <TableCell>
                JavaScript, TypeScript, Java, SQL, GraphQL, HTML, CSS.
              </TableCell>
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
              <TableCell>
                Technical Leadership, Mentorship, Cross-org Collaboration.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className={styles.block}>
        <Heading level={5} as="h2" className={styles.blockHeading}>
          Development
        </Heading>
        <Text size="m" as="div">
          <List className={styles.list}>
            <ListItem>
              <Link
                href="https://code.visualstudio.com/"
                onClick={trackToolLinkClick('VS Code')}
              >
                VS Code
              </Link>
              , One Dark Pro Monokai Darker, Operator Mono.
            </ListItem>
            <ListItem>
              <Link href="https://reactjs.org/" onClick={trackToolLinkClick('React')}>
                React
              </Link>{' '}
              for UI — the component model scales on large apps.
            </ListItem>
            <ListItem>
              <Link href="https://threejs.org/" onClick={trackToolLinkClick('three.js')}>
                three.js
              </Link>{' '}
              for 3D and image shaders.
            </ListItem>
            <ListItem>
              Vanilla CSS with{' '}
              <Link href="https://postcss.org/" onClick={trackToolLinkClick('PostCSS')}>
                PostCSS
              </Link>
              .
            </ListItem>
            <ListItem>
              <Link
                href="https://www.framer.com/motion/"
                onClick={trackToolLinkClick('Framer Motion')}
              >
                Framer Motion
              </Link>{' '}
              for spring animations.
            </ListItem>
            <ListItem>
              <Link
                href="https://storybook.js.org/"
                onClick={trackToolLinkClick('Storybook')}
              >
                Storybook
              </Link>{' '}
              for components in isolation.
            </ListItem>
            <ListItem>
              <Link href="https://www.figma.com/" onClick={trackToolLinkClick('Figma')}>
                Figma
              </Link>
              , including building internal plugins to sync design tokens into code.
            </ListItem>
          </List>
        </Text>
      </div>
    </div>
  </ViewportPage>
);
