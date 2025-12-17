  def self.send_admin_notification(booking)
    admin_user_id = ENV['ZALO_ADMIN_USER_ID']
    return unless admin_user_id

    message = "New booking received!\n" +
              "Customer: #{booking.customer_name}\n" +
              "Phone: #{booking.customer_phone}\n" +
              "Email: #{booking.customer_email}\n" +
              "Party Size: #{booking.party_size}\n" +
              "Date: #{booking.booking_date}\n" +
              "Time: #{booking.booking_time}\n" +
              "Duration: #{booking.duration_hours} hours\n" +
              "Notes: #{booking.notes}"

    send_message(admin_user_id, message)
  end
end
