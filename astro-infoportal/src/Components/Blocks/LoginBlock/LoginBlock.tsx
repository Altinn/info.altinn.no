import { Typography } from "@altinn/altinn-components";
import { LoginBlockViewModel } from "/Models/Generated/LoginBlockViewModel";
import "./LoginBlock.scss";

const LoginBlock = ({
  title,
  ingress,
  loginButtonSuffix,
}: LoginBlockViewModel) => {
  return (
    <div className="login-block">
      {title && <Typography as="h2">{title}</Typography>}
      {ingress && <Typography>{ingress}</Typography>}
      {loginButtonSuffix && (
        <Typography className="login-block__button-suffix">
          {loginButtonSuffix}
        </Typography>
      )}
    </div>
  );
};

export default LoginBlock;
