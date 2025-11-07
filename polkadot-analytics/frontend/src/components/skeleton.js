import React from 'react';
import { cn } from '../utils/cn'; // fixed path

const Card = React.forwardRef((props, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", props.className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardContent = React.forwardRef((props, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", props.className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardContent };
