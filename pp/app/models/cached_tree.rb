# frozen_string_literal: true

# == Schema Information
#
# Table name: cached_trees
#
#  id             :bigint           not null, primary key
#  cacheable_type :string           not null
#  context_key    :string           not null
#  data           :jsonb
#  deleted_at     :datetime
#  meta           :jsonb
#  query_params   :jsonb
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  cacheable_id   :bigint           not null
#
# Indexes
#
#  index_cached_trees_on_context_type_id  (context_key,cacheable_type,cacheable_id) WHERE (deleted_at IS NULL)
#  index_cached_trees_on_deleted_at       (deleted_at)
#
class CachedTree < ApplicationRecord
  CONTEXT_TO_CACHEABLE = {
    compare_podd: 'DataMart',
    compare_podd_podm: 'DataMart'
  }.freeze

  acts_as_paranoid

  belongs_to :cacheable, polymorphic: true

  validates :cacheable_type, presence: true
  validates :cacheable_id, presence: true
  validates :context_key, presence: true

  scope :for_cache, ->(key, type, id) { where(context_key: key, cacheable_type: type, cacheable_id: id) }

  def self.cacheable_class_name_for(context_key)
    key = context_key.to_sym
    class_name = CONTEXT_TO_CACHEABLE.fetch(key, nil)
    raise ArgumentError, "Unknown context_key '#{key}'" unless class_name

    class_name
  end
end
