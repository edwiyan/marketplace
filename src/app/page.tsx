import BrowsePage from "@/components/marketplace/BrowsePage";

export default function Home(props: PageProps<"/">) {
  return <BrowsePage searchParams={props.searchParams} />;
}
