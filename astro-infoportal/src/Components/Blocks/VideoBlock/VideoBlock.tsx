import "./VideoBlock.scss";

const VideoBlock = ({ videoType, url }: any) => {
  const isYoutube = videoType === 0;
  const isVimeo = videoType === 1;

  const youtubeUrl = url && url.includes("?") ? url : `${url}?wmode=transparent`;

  return (
    <figure className="block video-block">
      <div className="embed-responsive embed-responsive-16by9">
        {isYoutube && (
          <iframe
            width="690"
            height="388"
            title="Video - Youtube"
            src={youtubeUrl || ""}
            frameBorder="0"
            allowFullScreen
          />
        )}
        {isVimeo && (
          <iframe
            title="Video - Vimeo"
            src={url || ""}
            frameBorder="0"
            allowFullScreen
          />
        )}
      </div>
    </figure>
  );
};

export default VideoBlock;
