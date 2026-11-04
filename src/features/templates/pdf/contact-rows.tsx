import type { ComponentProps } from 'react';
import { View, Text, Link } from '@react-pdf/renderer';
import type { ContactItem } from '@/features/templates/model/resume-view';
import { CONTACT_ICONS } from '@/features/templates/pdf/pdf-icons';

type Style = ComponentProps<typeof View>['style'];

type ContactRowsProps = {
    rows: ContactItem[][];
    rowStyle: Style;
    itemStyle: Style;
    textStyle: Style;
    iconSize: number;
    iconColor: string;
};

// The header contact rows every template draws; only the styles and the icon look differ.
export const ContactRows = ({
    rows,
    rowStyle,
    itemStyle,
    textStyle,
    iconSize,
    iconColor,
}: ContactRowsProps) =>
    rows.map((row, i) => (
        <View key={i} style={rowStyle}>
            {row.map((item) => {
                const Icon = CONTACT_ICONS[item.kind];
                return (
                    <View key={item.kind} style={itemStyle}>
                        <Icon size={iconSize} color={iconColor} />
                        {item.href ? (
                            <Link src={item.href} style={textStyle}>
                                {item.text}
                            </Link>
                        ) : (
                            <Text style={textStyle}>{item.text}</Text>
                        )}
                    </View>
                );
            })}
        </View>
    ));
