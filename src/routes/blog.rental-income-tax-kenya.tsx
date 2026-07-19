import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const URL = "https://mnyumba-connect-property.lovable.app/blog/rental-income-tax-kenya";
const TITLE = "Rental income tax in Kenya: what landlords pay in 2026";
const DESC = "Plain-English guide to Kenya's Monthly Rental Income tax: who pays the 7.5%, how to file on iTax, deadlines, penalties and worked examples.";

export const Route = createFileRoute("/blog/rental-income-tax-kenya")({
  component: Post,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESC,
          author: { "@type": "Organization", name: "Mnyumba Connect" },
          publisher: { "@type": "Organization", name: "Mnyumba Connect" },
          mainEntityOfPage: URL,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "How much is rental income tax in Kenya?", acceptedAnswer: { "@type": "Answer", text: "Resident landlords earning between KES 288,000 and KES 15 million in gross rent per year pay Monthly Rental Income (MRI) tax at 7.5% of gross rent, with no deductions allowed." } },
            { "@type": "Question", name: "When is MRI tax due?", acceptedAnswer: { "@type": "Answer", text: "MRI is filed and paid on iTax by the 20th of the month following the month the rent was earned." } },
            { "@type": "Question", name: "Who can opt out of MRI?", acceptedAnswer: { "@type": "Answer", text: "Landlords earning above KES 15 million a year, non-residents, or those who write to the KRA Commissioner opting out, file under the normal income tax regime instead." } },
          ],
        }),
      },
    ],
  }),
});

function Post() {
  return (
    <article className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-2">Guide for landlords</p>
      <h1 className="text-3xl md:text-5xl font-bold mb-4">{TITLE}</h1>
      <p className="text-lg text-muted-foreground mb-10">If you rent out a home, flat or commercial unit in Kenya, the Kenya Revenue Authority (KRA) wants its share. Here's exactly how Monthly Rental Income (MRI) tax works in 2026 and how to stay compliant.</p>

      <div className="prose prose-neutral max-w-none space-y-5">
        <h2 className="text-2xl font-bold mt-8">What is rental income tax in Kenya?</h2>
        <p>Rental income tax is what the KRA charges on rent you collect from tenants. Since 2016, most resident landlords have paid it through the simplified <strong>Monthly Rental Income (MRI)</strong> regime — a flat <strong>7.5% of gross rent</strong>, with no deductions for repairs, agent fees or loan interest.</p>

        <h2 className="text-2xl font-bold mt-8">Who pays MRI at 7.5%?</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You are a <strong>resident</strong> individual or company</li>
          <li>Your gross annual rental income is between <strong>KES 288,000 and KES 15,000,000</strong></li>
          <li>The income is from <strong>residential or commercial property</strong> located in Kenya</li>
        </ul>
        <p>Earn less than 288,000 a year? You're below the bracket and only file an annual return. Earn more than 15 million? You file under the standard income tax regime, where deductions are allowed but rates are higher.</p>

        <h2 className="text-2xl font-bold mt-8">How much will I pay? A worked example</h2>
        <p>Say you own a 2-bedroom in Kileleshwa let at <strong>KES 45,000/month</strong>.</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Gross rent for the month: KES 45,000</li>
          <li>MRI due (7.5%): <strong>KES 3,375</strong></li>
          <li>Annual gross rent: KES 540,000</li>
          <li>Total MRI for the year: <strong>KES 40,500</strong></li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">How to file and pay on iTax</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Log into <strong>iTax</strong> with your KRA PIN.</li>
          <li>Go to <em>Returns → File Return → Income Tax — Rent Income</em>.</li>
          <li>Select the month, enter gross rent collected, and submit. iTax calculates the 7.5%.</li>
          <li>Generate a <strong>Payment Registration Number (PRN)</strong>.</li>
          <li>Pay via M-Pesa Paybill <strong>222222</strong>, bank or KRA agent, using the PRN as the account number.</li>
        </ol>
        <p>Deadline: <strong>the 20th of the following month</strong>. A nil return is required even if no rent was collected.</p>

        <h2 className="text-2xl font-bold mt-8">Penalties for late filing</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Late filing:</strong> KES 2,000 or 5% of tax due, whichever is higher.</li>
          <li><strong>Late payment:</strong> 5% of the tax due, plus 1% interest per month.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">Tips to stay on top of it</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Issue receipts for every rent payment and keep a monthly ledger per unit.</li>
          <li>Set a phone reminder for the 15th of each month — you'll never miss the 20th deadline.</li>
          <li>Open a separate M-Pesa till or bank account for rent so your records are clean at year-end.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">Make rent collection easier</h2>
        <p>Mnyumba Connect lets you list your property, track tenants and record rent payments in one dashboard — so your MRI filing is as simple as copying the monthly total into iTax.</p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/auth" search={{ mode: "signup" } as any}><Button size="lg">List your property — free</Button></Link>
        <Link to="/properties"><Button size="lg" variant="outline">Browse rentals</Button></Link>
      </div>

      <p className="text-xs text-muted-foreground mt-10">This guide is general information, not tax advice. Confirm details with the KRA or a registered tax agent for your specific situation.</p>
    </article>
  );
}
