import {generateMetadataForPage} from "@/lib/metadata";

export async function generateMetadata() {
    return await generateMetadataForPage("statutory-disclosure");
}

export default async function StatutoryDisclosurePage() {
    return (
        <div>
            <h1>Statutory Disclosure</h1>
        </div>
    );
}
