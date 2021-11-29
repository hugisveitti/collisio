import React from "react";

{
  /* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4972710693486281"
     crossorigin="anonymous"></script>
<!-- front-page -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-4972710693486281"
     data-ad-slot="7059022973"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script> */
}

interface IAdSence {
  slotId: string;
}
const AdSense = (props: IAdSence) => {
  // <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4972710693486281"
  // crossorigin="anonymous"></script>
  return (
    <React.Fragment>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4972710693486281"
        data-adtest="on"
        data-ad-slot={props.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </React.Fragment>
  );
};

export default AdSense;
