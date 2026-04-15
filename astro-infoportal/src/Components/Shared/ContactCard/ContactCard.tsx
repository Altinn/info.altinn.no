import { Button, ButtonIcon, ButtonLabel } from "@altinn/altinn-components";
import { type ReactNode, useEffect, useRef } from "react";
import "./ContactCard.scss";

export interface ContactCardItem {
  icon?: React.ComponentType;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ContactCardProps {
  children?: ReactNode;
  items?: ContactCardItem[];
}

const ContactCard = ({ children, items }: ContactCardProps) => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el || el.children.length < 2) return;

    const checkWrap = () => {
      el.classList.remove("contact-card__items--vertical");
      const childElements = Array.from(el.children);
      const firstTop = childElements[0].getBoundingClientRect().top;
      const hasWrapped = childElements.some(
        (child) => child.getBoundingClientRect().top !== firstTop,
      );
      if (hasWrapped) {
        el.classList.add("contact-card__items--vertical");
      }
    };

    checkWrap();
    const observer = new ResizeObserver(checkWrap);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="contact-card">
      {children}
      {items && items.length > 0 && (
        <ul className="contact-card__items" ref={listRef}>
          {items.map((item, idx) => {
            const isLink = !!item.href;
            return (
              <li className="contact-card__item" key={idx}>
                <Button
                  variant="outline"
                  as={isLink ? "a" : "button"}
                  href={isLink ? item.href : undefined}
                  onClick={item.onClick}
                >
                  {item.icon && <ButtonIcon icon={item.icon} />}
                  <ButtonLabel>{item.label}</ButtonLabel>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ContactCard;
