import Head from 'next/head';

interface StructuredDataProps {
  schema: object | object[];
}

export const StructuredData = ({ schema }: StructuredDataProps) => (
  <Head>
    <script
      key="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  </Head>
);
