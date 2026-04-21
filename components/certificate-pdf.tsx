import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  border: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 3,
    borderColor: '#1a56db',
    borderStyle: 'solid',
  },
  innerBorder: {
    position: 'absolute',
    top: 26,
    left: 26,
    right: 26,
    bottom: 26,
    borderWidth: 1,
    borderColor: '#1a56db',
    borderStyle: 'solid',
    opacity: 0.3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1a56db',
    letterSpacing: 3,
  },
  logoSub: {
    fontSize: 9,
    color: '#6b7280',
    letterSpacing: 2,
    marginTop: 4,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#1a56db',
    marginVertical: 20,
  },
  certTitle: {
    fontSize: 13,
    color: '#6b7280',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  recipientName: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1d23',
    marginBottom: 12,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1a56db',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  completionText: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 30,
  },
  dividerThin: {
    width: '60%',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 60,
    marginTop: 10,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 8,
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1d23',
  },
  certNumber: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 20,
    letterSpacing: 1,
  },
  stamp: {
    position: 'absolute',
    bottom: 60,
    right: 70,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#1a56db',
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  stampText: {
    fontSize: 7,
    color: '#1a56db',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
})

interface CertificatePDFProps {
  recipientName: string
  courseTitle: string
  certificateNumber: string
  issuedAt: string
}

export function CertificatePDF({ recipientName, courseTitle, certificateNumber, issuedAt }: CertificatePDFProps) {
  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document title={`EiE Certificate - ${recipientName}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        {/* Main content */}
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>EiE EDUCATION</Text>
            <Text style={styles.logoSub}>INSTRUCTOR TRAINING PLATFORM</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.certTitle}>Certificate of Completion</Text>

          <Text style={styles.bodyText}>This is to certify that</Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <Text style={styles.bodyText}>has successfully completed the course</Text>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
          <Text style={styles.completionText}>
            and has demonstrated proficiency through the assessment.
          </Text>

          <View style={styles.dividerThin} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Certificate No.</Text>
              <Text style={styles.metaValue}>{certificateNumber}</Text>
            </View>
          </View>

          <Text style={styles.certNumber}>EiE Education — Official Certificate</Text>
        </View>

        {/* Decorative stamp */}
        <View style={styles.stamp}>
          <Text style={styles.stampText}>EiE{'\n'}EDU</Text>
        </View>
      </Page>
    </Document>
  )
}
