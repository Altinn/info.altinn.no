import "./VideoFile.scss";

const VideoFile = ({ src, copyright, previewImage }: any) => {
  return (
    <div className="video-file">
      <video
        controls
        className="video-file__player"
        poster={previewImage?.src || ""}
      >
        <source src={src || ""} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {copyright && (
        <p className="video-file__copyright">{copyright}</p>
      )}
    </div>
  );
};

export default VideoFile;
